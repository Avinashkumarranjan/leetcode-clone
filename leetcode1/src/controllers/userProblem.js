const {getLanguageById,submitBatch,submitToken} = require("../utils/ProblemUtility");
const Problem = require("../models/problem")
const User = require("../models/user");

const shouldSkipJudge0 = () => {
  return String(process.env.SKIP_JUDGE0_VALIDATION || "").trim().toLowerCase() === "true";
};

const normalizeDifficulty = (difficulty) => {
  const d = String(difficulty || "").trim().toLowerCase();
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return difficulty;
};

const normalizeTag = (tags) => {
  const raw = Array.isArray(tags) ? tags[0] : tags;
  const t = String(raw || "").trim().toLowerCase();
  if (!t) return tags;

  if (t === "array" || t === "strings" || t === "string") return "array";
  if (t === "linkedlist" || t === "linked_list" || t === "linked list") return "linkedList";
  if (t === "graph" || t === "graphs") return "graph";
  if (t === "dp" || t === "dynamicprogramming" || t === "dynamic programming") return "dp";

  return raw;
};

const normalizeVisibleTestCases = (visibleTestCases) => {
  if (!Array.isArray(visibleTestCases)) return visibleTestCases;
  return visibleTestCases.map((t) => ({
    ...t,
    explanation: typeof t?.explanation === "string" ? t.explanation : ""
  }));
};

const normalizeProblemPayload = (payload) => {
  return {
    ...payload,
    difficulty: normalizeDifficulty(payload?.difficulty),
    tags: normalizeTag(payload?.tags),
    visibleTestCases: normalizeVisibleTestCases(payload?.visibleTestCases)
  };
};

const buildJudge0Failure = (submission, context = {}) => {
  const statusId = submission?.status_id;
  const status = submission?.status?.description || submission?.status?.id || submission?.status;
  const hint =
    statusId === 13
      ? "Judge0 Internal Error: usually worker sandbox permission issue. If using Docker, ensure workers run with privileged/seccomp=unconfined and restart the stack."
      : null;

  return {
    message: "Reference solution failed on Judge0",
    status_id: statusId,
    status,
    hint,
    judge0_message: submission?.message ?? null,
    token: submission?.token ?? null,
    language: context.language ?? null,
    language_id: context.language_id ?? null,
    stdout: submission?.stdout ?? null,
    stderr: submission?.stderr ?? null,
    compile_output: submission?.compile_output ?? null,
    time: submission?.time ?? null,
    memory: submission?.memory ?? null
  };
};

const validateSolutionWithJudge0 = async ({ referenceSolution, hiddenTestCases }) => {
  if(!Array.isArray(referenceSolution) || referenceSolution.length==0){
    throw new Error("referenceSolution must be a non-empty array");
  }

  if(!Array.isArray(hiddenTestCases) || hiddenTestCases.length==0){
    throw new Error("hiddenTestCases must be a non-empty array");
  }

  for(const {language,completeCode} of referenceSolution){
    const languageId = getLanguageById(language);

    const submissions = hiddenTestCases.map((testcase)=>({
        source_code:completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    const submitResult = await submitBatch(submissions);

    if(!Array.isArray(submitResult)){
      throw new Error("Judge0 submission failed");
    }

    const resultToken = submitResult.map((value)=> value.token).filter(Boolean);

    if(resultToken.length==0){
      throw new Error("Judge0 token is missing");
    }

   const testResult = await submitToken(resultToken);

   if(!Array.isArray(testResult)){
    throw new Error("Judge0 result failed");
   }

   for(const test of testResult){
    if(test.status_id!=3){
      const err = new Error("Reference solution failed on Judge0");
      err.judge0Failure = buildJudge0Failure(test, { language, language_id: languageId });
      throw err;
    }
   }
  }
};

const createProblem = async (req,res)=>{

    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
      const payload = normalizeProblemPayload(req.body);

      if(!Array.isArray(payload.visibleTestCases) || payload.visibleTestCases.length==0){
        return res.status(400).send("visibleTestCases must be a non-empty array");
      }

      if (!shouldSkipJudge0()) {
        await validateSolutionWithJudge0({
          referenceSolution: payload.referenceSolution,
          hiddenTestCases: payload.hiddenTestCases
        });
      }

      await Problem.create({
        ...payload,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Created Successfully");
    }
    catch(err){
        if (err && err.judge0Failure) {
          return res.status(422).json(err.judge0Failure);
        }

        const message = err instanceof Error ? err.message : String(err);
        const status = message.startsWith("Judge0") || message.includes("Judge0") ? 502 : 400;
        res.status(status).send("Error: " + message);
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }

    const referenceSolutionToUse = referenceSolution || DsaProblem.referenceSolution;
    const hiddenTestCasesToUse = hiddenTestCases || DsaProblem.hiddenTestCases;

    if(!Array.isArray(referenceSolutionToUse) || referenceSolutionToUse.length==0){
      return res.status(400).send("referenceSolution must be a non-empty array");
    }

    if(!Array.isArray(hiddenTestCasesToUse) || hiddenTestCasesToUse.length==0){
      return res.status(400).send("hiddenTestCases must be a non-empty array");
    }
      
    if (!shouldSkipJudge0()) {
      await validateSolutionWithJudge0({
        referenceSolution: referenceSolutionToUse,
        hiddenTestCases: hiddenTestCasesToUse
      });
    }


  const payload = normalizeProblemPayload(req.body);
  const newProblem = await Problem.findByIdAndUpdate(id , {...payload}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      if (err && err.judge0Failure) {
        return res.status(422).json(err.judge0Failure);
      }

      const message = err instanceof Error ? err.message : String(err);
      const status = message.startsWith("Judge0") || message.includes("Judge0") ? 502 : 500;
      res.status(status).send("Error: " + message);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select("_id title description difficulty tags visibleTestCases startCode referenceSolution");

   if(!getProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select("_id title  difficulty tags");

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}




const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      if(!user)
        return res.status(404).send("User not found");

      return res.status(200).send(user.problemSolved);

    }
    catch(err){
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).send("Server Error: " + message);
    }
}


const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

  const ans = await Submission.find({userId,problemId});
  
  if(ans.length==0)
    res.status(200).send("No Submission is persent");

  res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser};
