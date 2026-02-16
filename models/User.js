import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
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
    plainPassword: {    // Store original password
      type: String,
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
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//  Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
