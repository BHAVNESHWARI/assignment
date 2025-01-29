const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/eventManagement", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Organizer Schema
const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_info: String,
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
});
const Organizer = mongoose.model("Organizer", organizerSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  location: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "Organizer", required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Registration" }],
});
const Event = mongoose.model("Event", eventSchema);

// Attendee Schema
const attendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Registration" }],
});
const Attendee = mongoose.model("Attendee", attendeeSchema);

// Registration Schema
const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: "Attendee", required: true },
  registration_date: { type: Date, default: Date.now },
});
const Registration = mongoose.model("Registration", registrationSchema);

// Register an Attendee
app.post("/register", async (req, res) => {
  const { attendeeId, eventId } = req.body;

  const existingRegistration = await Registration.findOne({ attendee: attendeeId, event: eventId });
  if (existingRegistration) return res.status(400).send("Attendee already registered for this event");

  const registration = new Registration({ attendee: attendeeId, event: eventId });
  await registration.save();

  await Attendee.findByIdAndUpdate(attendeeId, { $push: { registrations: registration._id } });
  await Event.findByIdAndUpdate(eventId, { $push: { attendees: registration._id } });

  res.status(200).send("Registration successful");
});

// List Attendees of an Event
app.get("/attendees/:eventId", async (req, res) => {
  const registrations = await Registration.find({ event: req.params.eventId }).populate("attendee");
  res.status(200).json(registrations);
});

// List Events Attended by a User
app.get("/events/:attendeeId", async (req, res) => {
  const registrations = await Registration.find({ attendee: req.params.attendeeId }).populate("event");
  res.status(200).json(registrations);
});

// Update Event Details
app.put("/events/:eventId", async (req, res) => {
  const updatedEvent = await Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true });
  res.status(200).json(updatedEvent);
});

// Cancel a Registration
app.delete("/registrations/:registrationId", async (req, res) => {
  const registration = await Registration.findByIdAndDelete(req.params.registrationId);
  if (!registration) return res.status(404).send("Registration not found");
  res.status(200).send("Registration cancelled successfully");
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});