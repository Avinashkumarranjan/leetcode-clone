const {getLanguageById,submitBatch} = require("../utils/ProblemUtility")

const createProblem = async (req,res)=>{
    const{title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution,
    problemCreator}=req.body;

    try {
        for(const {language,completeCode}of referenceSolution){
          
            
            const languageId = getLanguageById();
            

            // I am creating batch submission,batch means c,c++,java etc
            const submissions = visibleTestCases.map((input,output)=>({
                source_code:completeCode,
                language_id:languageId,
                stdin:input,
                expected_output:output

            }));

            const submitResult = await submitBatch(submissions);
        }
    } catch (error) {
        
    }
}