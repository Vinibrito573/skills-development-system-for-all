// NAMING SERVICE: in this file i will be storing all the address of all services done, simple way to descover service

const services = {
    userTraining: "localhost:50051",
    trainingSuggestion: "localhost:50052",
    activityNotification: "localhost:50053"
};

//Below is a function to get the service address by name:
function getService(serviceName) {
    return services[serviceName];
}
module.exports = { getService };