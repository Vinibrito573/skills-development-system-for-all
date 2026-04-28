// TRAINING SUGGESTION CLIENT - Server-side Streaming RPC
// This client sends a user profile to the Training Suggestion Service, 
// and receives multiple training recommendations from the server.

//Importing gRPC library
const grpc =require("@grpc/grpc-js");

//Importing proto loader to be able to read the proto files
const protoLoader =require("@grpc/proto-loader");

//Importing the path to locate the files
const path = require("path");
const PROTO_PATH= path.join(__dirname,"../protos/training_suggestion.proto");

//Proto file definition
const packageDefinition =protoLoader.loadSync(PROTO_PATH);
const trainingSuggestionProto= grpc.loadPackageDefinition(packageDefinition).trainingsuggestion;

//Creating a client that connects to the Training Suggestion Service on port 50052
const client = new trainingSuggestionProto.TrainingSuggestionService("localhost:50052",grpc.credentials.createInsecure()
);

//User profile sent to the server
const userProfile = {
    userId: 1,
    ageGroup: "50+",
    employmentStatus: "Unemployed",
    skillLevel: "Beginner"
};

// Calling the server-side streaming RPC
const call =client.StreamRecommendedTrainings(userProfile);

// This event runs every time the server sends one recommendation
call.on("data", (recommendation) =>{
    console.log("Recommendation received:");
    console.log(recommendation);
});

// This event runs when the server finishes sending all recommendations
call.on("end", () =>{
    console.log("No more recommendations. Stream ended.");
});

//This event runs if an error occurs
call.on("error", (error) => {
    console.error("Error:", error.message);
});