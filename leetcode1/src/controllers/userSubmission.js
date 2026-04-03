const mongoose = require("mongoose");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken} = require("../utils/ProblemUtility");

const shouldSkipJudge0Execution = () => {
  return String(process.env.SKIP_JUDGE0_EXECUTION || "").trim().toLowerCase() === "true";
};

const getParsedBody = (rawBody) => {
  if (!rawBody) return {};
  if (typeof rawBody === "string") {
    try {
      const parsed = JSON.parse(rawBody);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return rawBody;
};

const submitCode = async (req,res)=>{
   
    // 
    try{
       const userId = req.result?._id;
       const problemId = req.params?.id;

       const body = getParsedBody(req.body);
       const code = body?.code ?? body?.source_code ?? body?.solution;
       const language = body?.language ?? body?.lang;

      if(!userId)
       return res.status(401).send("Unauthorized");

      if(!problemId)
        return res.status(400).send("Missing field: id");
      if(!mongoose.Types.ObjectId.isValid(problemId))
        return res.status(400).send("Invalid problem id");

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
      await User.updateOne(
        { _id: userId },
        { $addToSet: { problemSolved: problemId } }
      );
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

    if (status === "accepted") {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { problemSolved: problemId } }
      );
    }

    return res.status(201).send(submittedResult);
       
    }
    catch(err){
      return res.status(500).send("Internal Server Error "+ err);
    }

}

  
const runCode = async(req,res)=>{
      try{
       const userId = req.result?._id;
       const problemId = req.params?.id;

       const body = getParsedBody(req.body);
       const code = body?.code ?? body?.source_code ?? body?.solution;
       const language = body?.language ?? body?.lang;

      if(!userId)
       return res.status(401).send("Unauthorized");

      if(!problemId)
        return res.status(400).send("Missing field: id");
      if(!mongoose.Types.ObjectId.isValid(problemId))
        return res.status(400).send("Invalid problem id");

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

    if (shouldSkipJudge0Execution()) {
      const languageId = getLanguageById(language);
      const now = new Date().toISOString();
      const mocked = (problem.visibleTestCases || []).map((testcase, idx) => ({
        token: `skipped-${idx}`,
        source_code: code,
        language_id: languageId,
        stdin: testcase?.input ?? "",
        expected_output: testcase?.output ?? "",
        stdout: null,
        stderr: null,
        compile_output: null,
        message: null,
        status_id: 3,
        status: { id: 3, description: "Accepted" },
        time: "0.001",
        memory: 1,
        created_at: now,
        finished_at: now
      }));
      return res.status(200).json(mocked);
    }

    //    Judge0 code ko submit karna hai

    const languageId = getLanguageById(language);

    const submissions = (problem.visibleTestCases || []).map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    if(submissions.length === 0)
      return res.status(400).send("No visible testcases available for run");

    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    
    const merged = testResult.map((result, idx) => ({
      ...result,
      token: submitResult?.[idx]?.token ?? result?.token,
      source_code: code,
      language_id: languageId,
      stdin: submissions?.[idx]?.stdin ?? "",
      expected_output: submissions?.[idx]?.expected_output ?? ""
    }));

    return res.status(200).json(merged);
       
    }
    catch(err){
      return res.status(500).send("Internal Server Error "+ err);
    }
}

module.exports = {submitCode,runCode};
