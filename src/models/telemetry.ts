import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetryPosition {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  direction?: number;
  satellites?: number;
  speed?: number;
  valid?: boolean;
}

export interface ITelemetryEngine {
  ignitionStatus?: boolean;
  totalFuelUsed?: number;
}

export interface ITelemetryVehicleData {
  mileage?: number;
}

export interface ITelemetry extends Document {
  vehicleIdent: string;
  timestamp: Date;
  messageHash: string;
  position?: ITelemetryPosition;
  engine?: ITelemetryEngine;
  movementStatus?: boolean;
  vehicle?: ITelemetryVehicleData;
  batteryVoltage?: number;
  externalPowerVoltage?: number;
  gsmSignalLevel?: number;
  rawPayload: Record<string, any>;
  createdAt: Date;
}

const TelemetrySchema = new Schema<ITelemetry>(
  {
    vehicleIdent: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    messageHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    position: {
      latitude: { type: Number },
      longitude: { type: Number },
      altitude: { type: Number },
      direction: { type: Number },
      satellites: { type: Number },
      speed: { type: Number },
      valid: { type: Boolean },
    },
    engine: {
      ignitionStatus: { type: Boolean },
      totalFuelUsed: { type: Number },
    },
    movementStatus: { type: Boolean },
    vehicle: {
      mileage: { type: Number },
    },
    batteryVoltage: { type: Number },
    externalPowerVoltage: { type: Number },
    gsmSignalLevel: { type: Number },
    rawPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: false, // its is used to make the schema not strict and if any other data comes that also get stored in the db.
  }
);

TelemetrySchema.index({ vehicleIdent: 1, timestamp: 1 });

export const Telemetry = mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
