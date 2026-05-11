import axios from "axios";

const sendBillingSMS = async (mobile, name, invoiceNumber, finalTotal, invoiceUrl, branchName) => {
  try {

    const message = `Hello ${name}, Your order # ${invoiceNumber} has been successfully processed. Total Amount: ${finalTotal}. Download your invoice: ${invoiceUrl} Thank you for choosing ${branchName}! - SaaScraft Studio`;
    const params = {
      APIKey: process.env.SMS_GATEWAY_API_KEY,
      senderid: process.env.SMS_GATEWAY_SENDER_ID,
      channel: "2",
      DCS: "0",
      flashsms: "0",
      number: mobile,
      text: message,
      route: process.env.SMS_GATEWAY_ROUTE,
      EntityId: process.env.SMS_GATEWAY_ENTITY_ID,
      dlttemplateid: process.env.SMS_GATEWAY_TEMPLATE_ID,
    };

    const response = await axios.get(process.env.SMS_GATEWAY_URL, { params });

    return response.data;
  } catch (error) {
    console.error("Billing SMS Error:", error.response?.data || error.message);
    throw error;
  }
};

export default sendBillingSMS;