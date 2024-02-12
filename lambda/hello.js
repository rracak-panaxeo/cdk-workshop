exports.handler = async function(event) {
    console.log("hello lambda handler:", JSON.stringify(event, undefined, 2));
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `Good afternoon, CDK 1.0! You've hit ${event.path}\n`
    };
  };