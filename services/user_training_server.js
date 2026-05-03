//USER TRAINING SERVICE - gRPC Unary RPC
//The service below will be responsible for assigning training to users and validating the input data.

//Starting importing gRPC library
const grpc = require ("@grpc/grpc-js");

//Importing proto loader to read proto files
const protoLoader = require ("@grpc/proto-loader");

//Importing path to be able to locate files
const path=require ("path");
const PROTO_PATH=path.join(__dirname, "../protos/user_training.proto");

//Loading the proto file definition
const packageDefinition =protoLoader.loadSync(PROTO_PATH);

//Creating an object so we need to convert the proto
const userTrainingProto=grpc.loadPackageDefinition (packageDefinition).usertraining;


//Implementing the Unary RPC:

//Creating a function that will be responsible for handling AssignTraining Requests
function assignTraining(call, callback){
    
    //getting data from the user
    const request=call.request;
    

//Validation and error handling
if (!request.userId || request.userId <=0){
    callback(null,{
        enrollmentId: "",
        success:false,
        message: "Sorry, The User ID is invalid! Please enter a positive number."
        });
        return;
}

//Checking if the training title is valid
if (!request.trainingTitle){
    callback(null,{
        enrollmentId: "",
        success: false,
        message: "Please enter the Training Title!"
    });
    return;
}

//Generating the enrolment ID
const enrollmentId= "ENR-" + request.userId + "-" + Date.now();
//Sending the confirmation
callback (null,{
    enrollmentId: enrollmentId,
    success: true,
    message: "Training has been assigned to your User ID, thank you!"
});
}

// Setting the Server//

//Creating a new gRPC server
const server = new grpc.Server();

//Linking the proto service with the function
server.addService(userTrainingProto.UserTrainingService.service, {
    AssignTraining: assignTraining });

//Initiating the server on port 50051, as it is the default conventiion used in the gRPC examples, so each services will run\
//in a different port to avoid issues.
server.bindAsync( "0.0.0.0:50051", 
    grpc.ServerCredentials.createInsecure(),
    function (){
        console.log ("This User Training Service is running on port 50051");
    }
);

