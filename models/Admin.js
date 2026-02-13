import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AdminSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      match: [/^\d{10}$/, "Contact number must be 10 digits"],
      trim: true,
      unique: true,
    },
    teliphoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    timeZone: {
      type: String, // e.g., "Asia/Kolkata"
      required: [true, "Time Zone is required"],
    },
    websiteLink: {
      type: String,
      required: [true, "Website is required"],
      trim: true,
    },
    panNumber: {
      type: String,
      required: [true, "Pan number is required"],
      trim: true,
    },
    GstRegistrationType: {
      type: String,
      required: [true, "GST Registration Type is required"],
      trim: true,
    },
    gstIn: {
      type: String,
      required: [true, "GST is required"],
      trim: true,
    },
    financialStartDate: {
      type: Date,
      required: [true, "start date is required"],
    },
    financialEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return (
            !this.financialStartDate ||
            value >= this.financialStartDate
          );
        },
        message:
          "financial end date must be greater than or equal to start date",
      },
      required: [true, "End date is required"],
    },
    cinNumber: {
      type: String,
      required: [true, "CIN number is required"],
      trim: true,
    },
    fssaiNumber: {
      type: String,
      required: [true, "FSSAI number is required"],
      trim: true,
    },
    lutNumber: {
      type: String,
      required: [true, "LUT number is required"],
      trim: true,
    },
    tanNumber: {
      type: String,
      required: [true, "TAN number is required"],
      trim: true,
    },
    iecNumber: {
      type: String,
      required: [true, "IEC number is required"],
      trim: true,
    },
    //  For forgot-password/reset-password
    passwordResetToken: {
      type: String,
      trim: true,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);


//  Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//  Compare entered password with hashed password
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);
