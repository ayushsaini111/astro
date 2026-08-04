// src/lib/timeSlots.js

export const TIME_SLOTS = [
  { 
    id: 1, 
    label: "Morning", 
    time: "8:00 AM - 12:00 PM", 
    value: "8-12",
    enum: "SLOT_8_12" 
  },
  { 
    id: 2, 
    label: "Afternoon", 
    time: "12:00 PM - 3:00 PM", 
    value: "12-15",
    enum: "SLOT_12_15" 
  },
  { 
    id: 3, 
    label: "Evening", 
    time: "3:00 PM - 7:00 PM", 
    value: "15-19",
    enum: "SLOT_15_19" 
  },
  { 
    id: 4, 
    label: "Night", 
    time: "7:00 PM - 10:00 PM", 
    value: "19-22",
    enum: "SLOT_19_22" 
  },
];

/**
 * Convert time slot value (e.g., "8-12") to Prisma enum (e.g., "SLOT_8_12")
 */
export const getTimeSlotEnum = (value) => {
  const slot = TIME_SLOTS.find(s => s.value === value);
  return slot?.enum || "SLOT_8_12";
};

/**
 * Convert Prisma enum to readable label
 */
export const getTimeSlotLabel = (enumValue) => {
  const slot = TIME_SLOTS.find(s => s.enum === enumValue);
  return slot?.time || "8:00 AM - 12:00 PM";
};

/**
 * Convert pooja mode to Prisma enum
 */
export const getPoojaModeEnum = (mode) => {
  return mode === "Video Call" ? "VIDEO_CALL" : "AT_HOME";
};

/**
 * Convert Prisma enum to readable mode name
 */
export const getPoojaModeName = (enumValue) => {
  return enumValue === "VIDEO_CALL" ? "Video Call" : "At Home";
};