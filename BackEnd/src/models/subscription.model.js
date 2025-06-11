import mongoose,{Schema} from "mongoose"

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // Users who subscribed to any channel 
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // User who got subscribed by other subscribers
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription",subscriptionSchema)