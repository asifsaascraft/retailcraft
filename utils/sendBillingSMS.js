import axios from "axios";

const sendBillingSMS = async (mobile, invoiceNumber, amount) => {
  try {
    const message = `Thank you for your purchase. Invoice ${invoiceNumber} of amount ₹${amount} is successfully generated. - SaaScraft`;

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
    console.log("SMS PARAMS:", params); // ✅ ADD THIS

    const response = await axios.get(process.env.SMS_GATEWAY_URL, { params });

    console.log("SMS RESPONSE:", response.data); // ✅ ADD THIS


    return response.data;
  } catch (error) {
    console.error("Billing SMS Error:", error.response?.data || error.message);
    throw error;
  }
};

export default sendBillingSMS;