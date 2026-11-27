// The head pose type (design, "Data Models"). The camera code that produces it arrives in spec 2.

/**
 * A head pose, in degrees.
 * yaw: + is the patient's right (screen +x). pitch: + is up (screen -y). roll: + tips the crown to the right.
 */
export type HeadPose = { yawDeg: number; pitchDeg: number; rollDeg: number };
