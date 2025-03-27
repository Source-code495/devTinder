const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
// const router = express.Router(); 
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const {validateWebhookSignature} =  require("razorpay/dist/utils/razorpay-utils");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
    try {
      const { membershipType } = req.body;
      const { firstName, lastName, emailId } = req.user;
  
      const order = await razorpayInstance.orders.create({
        amount: membershipAmount[membershipType] * 100,
        currency: "INR",
        receipt: "receipt#1",
        notes: {
          firstName,
          lastName,
          emailId,
          membershipType: membershipType,
        },
      });
  
      // Save it in my database
      console.log(order);
  
      const payment = new Payment({
        userId: req.user._id,
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      });
  
      const savedPayment = await payment.save();
  
      // Return back my order details to frontend
      res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID }); 
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  });

  // userAuth is not needed for webhook 
paymentRouter.post("/payment/webhook",async (req,res)=>{
    try{
      const webhookSignature = req.headers("X-Razorpay-Signature");

      const isWebhookValid = validateWebhookSignature(
        JSON.stringify(req.body),
        webhookSignature,
        process.env.RAZORPAY_WEBHOOK_SECRET
      );
      // validateWebhookSignature can only be verified when an it came form authentic source 
      if(!isWebhookValid){
        return res.status(400).json({message:"Webhook signature is inValid"});
      } 

      // IF CAPTURED
      // update the payment Status in DB
      const paymentDetails = req.body.payload.payment.entity;

      const payment = await Payment.findOne({orderId:paymentDetails.order_id}); 
      payment.status = paymentDetails.status;
      await payment.save();

      const user = await User.findOne({_id : payment.userId});
      user.isPremium = true;
      user.membershipType = payment.notes.membershipType;
      await user.save();
      // Update the User as premium 
      // return success response to razorpay if it is not done it will keep on calling 
      // if(req.body.event == "payment.captured"){

      // }
      // if(req.body.event == "payment.failed"){

      // }
 
      return res.status(200).json({message :"Webhook received Successfully"});  // return success response to razorpay

    }catch(err){
      return res.status(500).json({msg:err.message});
    }
});

paymentRouter.get("/payment/verify",userAuth,async (req,res)=>{
    const user = req.user.toJSON();
    console.log(user);
    if(user.isPremium){
      return res.status(200).json({...user});
    }
    return res.json({...user});
});
  module.exports = paymentRouter;