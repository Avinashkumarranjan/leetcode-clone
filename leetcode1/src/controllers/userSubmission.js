const Problem = require("../models/problem");
const Submission = require("../models/submission");
const {getLanguageById,submitBatch,submitToken} = require("../utils/ProblemUtility");

const shouldSkipJudge0Execution = () => {
  return String(process.env.SKIP_JUDGE0_EXECUTION || "").trim().toLowerCase() === "true";
};

const submitCode = async (req,res)=>{
   
    // 
    try{
       const userId = req.result?._id;
       const problemId = req.params?.id;

       const code = req.body?.code ?? req.body?.source_code ?? req.body?.solution;
       const language = req.body?.language ?? req.body?.lang;

      if(!userId)
        return res.status(401).send("Unauthorized");

      if(!problemId)
        return res.status(400).send("Missing field: id");

      const missing = [];
      if(!code) missing.push("code");
      if(!language) missing.push("language");
      if(missing.length>0)
        return res.status(400).send(`Missing field(s): ${missing.join(", ")}`);

    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
       if(!problem)
         return res.status(404).send("Problem not found");
    //    testcases(Hidden)

    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
        })

    if (shouldSkipJudge0Execution()) {
      submittedResult.status = "accepted";
      submittedResult.testCasesPassed = problem.hiddenTestCases.length;
      submittedResult.errorMessage = null;
      submittedResult.runtime = 0.001;
      submittedResult.memory = 1;
      await submittedResult.save();
      return res.status(201).send(submittedResult);
    }

    //    Judge0 code ko submit karna hai

    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));


    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'wrong'
            errorMessage = test.stderr || test.compile_output || test.message || null
          } else {
            status = 'error'
            errorMessage = test.stderr || test.compile_output || test.message || null
          } 
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();

    res.status(201).send(submittedResult);
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }

}

module.exports = submitCode;

