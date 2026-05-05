// GUI - Main Controller
// This file connects the GUI to all gRPC services

// Importing express to create the web server
const express = require("express");
const app = express();

// Importing gRPC library
const grpc = require("@grpc/grpc-js");

// Importing proto loader to read proto files
const protoLoader = require("@grpc/proto-loader");

// Importing path to locate files
const path = require("path");

// Importing naming service to get service addresses
const { getService } = require("../naming_service");

// Setting up below the EJS as the view engine
// EJS allows us to send data from Node.js to the HTML page
app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));

// This allows the app to read data sent from the HTML forms
app.use(express.urlencoded({ extended:true }));


// Loading the proto files 

const userTrainingProto = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(__dirname, "../protos/user_training.proto"))
).usertraining;

const trainingSuggestionProto = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(__dirname, "../protos/training_suggestion.proto"))
).trainingsuggestion;

const activityProto = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(__dirname, "../protos/activity_notification.proto"))
).activitynotification;


// Creating gRPC clients - Each client connects to its service using the address from naming_service

const userTrainingClient = new userTrainingProto.UserTrainingService(
  getService("userTraining"),
  grpc.credentials.createInsecure()
);

const trainingSuggestionClient = new trainingSuggestionProto.TrainingSuggestionService(
  getService("trainingSuggestion"),
  grpc.credentials.createInsecure()
);

const activityClient = new activityProto.ActivityNotificationService(
  getService("activityNotification"),
  grpc.credentials.createInsecure()
);

// This function below will help to create metadata, which is the extra information in the header of each gRPC call

function createMetadata() {
  const metadata = new grpc.Metadata();
  metadata.add("client-version", "1.0");
  metadata.add("timestamp", new Date().toISOString());
  return metadata;
}
 
// This function below is to create a dealine,for exemple the timeout when do not have interaction with the user in a period
// if not interactionm, then the call will be cancelled
function createDeadline(seconds) {
  const deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + seconds);
  return deadline;
}

// MAIN - Home page

// When the user opens http://localhost:3000, so it runs
app.get("/", (req, res) => {
  res.render("index", {
    title: "Skills Development System for All",
    result: null,
    error: null,
    section: null
  });
});

//  Assigning Training (Unary RPC)

// When the user clicks "Assign Training", this runs
app.post("/assign-training", (req, res) => {

  // Getting the data from the form
  const request = {
    userId: parseInt(req.body.userId),
    dateOfBirth: req.body.dateOfBirth,
    employmentStatus: req.body.employmentStatus,
    trainingTitle: req.body.trainingTitle,
    category: req.body.category,
    dueDate: ""
  };

// Creating metadata and deadline for this call
// Deadline of 8 seconds, so if the server does not respond in 5 seconds, then the call is cancelled
  const metadata = createMetadata();
  const options = { deadline: createDeadline(8) };
 

  // Calling the Unary RPC - sends one request and receives one response
  userTrainingClient.AssignTraining(request, metadata, options, (error, response) => {

    // If we have an error
    if (error) {
      res.render("index", {
        title: "Skills Development System for All",
        result: null,
        error: "Error: " + error.message,
        section: "assign"
      });
    } else {
      // If successful, send the response to the page
      res.render("index", {
        title: "Skills Development System for All",
        result: response,
        error: null,
        section: "assign"
      });
    }
  });
});

// Getting Recommendations  (Server-side Streaming RPC)

// When the user clicks on "Get Recommendations", so it runs:
app.post("/get-recommendations", (req, res) => {
  // Getting the data from the form
  const userProfile = {
    userId: parseInt(req.body.userId),
    ageGroup: req.body.ageGroup,
    employmentStatus: req.body.employmentStatus,
    skillLevel: req.body.skillLevel
  };

  // This array will store all recommendations received from the server
  const recommendations = [];

  // To make sure we only send one response to the page
  let responseSent = false;

// Creating metadata and deadline for this call
// Deadline of 8 seconds, so if the server does not respond in 5 seconds, then the call is cancelled
  const metadata = createMetadata();
  const options = { deadline: createDeadline(8) };


  // Calling the Server-side Streaming RPC
  const call = trainingSuggestionClient.StreamRecommendedTrainings(userProfile, metadata, options);

  // Every time the server sends one recommendation, so this runs
  call.on("data", (recommendation) => {recommendations.push(recommendation);
  });

  // When the server finishes sending all recommendations, so this runs
  call.on("end", () => {
    if (!responseSent) {
      responseSent = true;
      res.render("index", {
        title: "Skills Development System for All",
        result: recommendations,
        error: null,
        section: "recommendations"
      });
    }
  });

  // If we have an error
  call.on("error", (error) => {
    if (!responseSent) {
      responseSent = true;
      res.render("index", {
        title: "Skills Development System for All",
        result: null,
        error: "Error: " + error.message,
        section: "recommendations"
      });
    }
  });
});

// Upload Activities (Client-side Streaming RPC)

// When the user clicks "Upload Activities", so it runs
app.post("/upload-activity", (req, res) => {

// Flag to make sure we only send one response to the page
  let responseSent = false;

// Creating metadata for this call
const metadata = createMetadata();

// Calling the Client-side Streaming RPC
// When the server sends the final summary, this runs
const call = activityClient.UploadUserActivity(metadata, (error, response) => {

    if (!responseSent) {
      responseSent = true;

      // If we have an error
      if (error) {
        res.render("index", {
          title: "Skills Development System for All",
          result: null,
          error: "Error: " + error.message,
          section: "activity"
        });
      } else {
        // If successful, then send the summary to the page
        res.render("index", {
          title: "Skills Development System for All",
          result: response,
          error: null,
          section: "activity"
        });
      }
    }
  });

  // Sending 3 activities to the server one by one
  call.write({ userId: parseInt(req.body.userId), activityType: "module", score: parseInt(req.body.score1) });
  call.write({ userId: parseInt(req.body.userId), activityType: "quiz", score: parseInt(req.body.score2) });
  call.write({ userId: parseInt(req.body.userId), activityType: "module", score: parseInt(req.body.score3) });

  // Finished sending to the server
  call.end();
});


// Starting the web server on port 3000
app.listen(3000, () => {
  console.log("Skills Development System for All - GUI is running at http://localhost:3000");
});