// TRAINING SUGGESTION SERVICE - gRPC Server-side Streaming
// This service recommends training programmes to users based on their profile set during registration

// Starting importing gRPC library
const grpc =require("@grpc/grpc-js");

// Importing proto loader to read proto files
const protoLoader =require("@grpc/proto-loader");

//Importing path to be able to locate files
const path =require("path");
const PROTO_PATH= path.join(__dirname, "../protos/training_suggestion.proto");

// Loading the proto file definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH);

// Creating an object so we need to convert the proto
const trainingSuggestionProto = grpc.loadPackageDefinition(packageDefinition).trainingsuggestion;


// Sample training recommendations
const recommendations = [
    {
        trainingId: 1,
        trainingTitle: "Basic Computer Skills",
        reason: "This training is recommended for users with beginner technology skills.",
        durationHours: 20
    },
    {
        trainingId: 2,
        trainingTitle: "Introduction to Excel",
        reason: "This training is recommended to improve employability and office skills.",
        durationHours: 15
    },
    {
        trainingId: 3,
        trainingTitle: "Interview Preparation and How to Write a CV",
        reason: "This training is recommended for users preparing to enter the job market.",
        durationHours: 10
    }
];

//Implementing the server-side streaming RPC
//Creating a function that will be responsible for handling Recommended Trainings to the users
function streamRecommendedTrainings(call){ const request = call.request;
    
//Basic validation
    if (!request.userId || request.userId <=0){
        call.write({
        trainingId: 0,
        trainingTitle: "Sorry, The User ID is invalid!",
        reason: "User ID must be a positive number.",
        durationHours: 0
    });
    call.end();
    return;
    }
  // Sending multiple recommendations one by one
  recommendations.forEach((training) => {call.write(training);
  });

  // Ending stream
  call.end();
}

// Setting the server
//Creating a new gRPC server
const server = new grpc.Server();

server.addService(trainingSuggestionProto.TrainingSuggestionService.service,{
StreamRecommendedTrainings: streamRecommendedTrainings
});

// Port 50052 is used for this second service to avoid conflicts with User Training Service
server.bindAsync(
    "0.0.0.0:50052",
    grpc.ServerCredentials.createInsecure(),
    function () {
    console.log("Training Suggestion Service running on port 50052");
  }
);