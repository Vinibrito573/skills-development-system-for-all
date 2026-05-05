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


// Training recommendations organised by age group
const recommendationsByAge={ "18-30": [
    {
        trainingId: 1,
        trainingTitle: "Interview Preparation and How to Write a CV",
        reason: "This training is recommended for young people entering the job market for the first time.",
        durationHours: 10
    },
    {
        trainingId: 2,
        trainingTitle: "LinkedIn Profile Setup",
        reason: "Building a professional online presence is essential for young job seekers today.",
        durationHours: 5
    },
    {
        trainingId: 3,
        trainingTitle: "Introduction to Excel",
        reason: "Excel is one of the most requested skills by employers across all industries.",
        durationHours: 15
    }
  ],
  "31-50": [
    {
        trainingId: 4,
        trainingTitle: "Project Management Basics",
        reason: "This training helps experienced workers take on leadership and coordination roles.",
        durationHours: 20
    },
    {
        trainingId: 5,
        trainingTitle: "Excel Advanced",
        reason: "Advancing Excel skills increases productivity and opens new career opportunities.",
        durationHours: 15
    },
    {
        trainingId: 6,
        trainingTitle: "Introduction to Digital Marketing",
        reason: "Digital skills are increasingly required across all sectors of the economy.",
        durationHours: 20
    }
  ],
  "50+": [
    {
        trainingId: 7,
        trainingTitle: "Basic Computer Skills",
        reason: "This training is recommended for users who are new to computers and digital tools.",
        durationHours: 20
    },
    {
        trainingId: 8,
        trainingTitle: "Introduction to Email and the Internet",
        reason: "Learning to use email and browse the internet safely is essential in today's workplace.",
        durationHours: 10
    },
    {
        trainingId: 9,
        trainingTitle: "Introduction to Excel",
        reason: "Excel is one of the most requested skills by employers and is useful at any age.",
        durationHours: 15
    }
]
};

//Implementing the server-side streaming RPC
//Creating a function that will be responsible for handling Recommended Trainings to the users
function streamRecommendedTrainings(call) {
    const request = call.request;

    // Basic validation
  if (!request.userId || request.userId <= 0) {
    call.write({
      trainingId: 0,
      trainingTitle: "Sorry, The User ID is invalid!",
      reason: "User ID must be a positive number.",
      durationHours: 0
    });
    call.end();
    return;
  }

// Get recommendations based on age group
const recommendations = recommendationsByAge[request.ageGroup];

// If age group not found
    if (!recommendations) {
    call.write({
      trainingId: 0,
      trainingTitle: "No recommendations found",
      reason: "Please select a valid age group.",
      durationHours: 0
    });
    call.end();
    return;
  }

// Sending recommendations one by one
recommendations.forEach((training) => {
call.write(training);
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