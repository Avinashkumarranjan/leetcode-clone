const { getLanguageById, submitBatch, submitToken } = require("../utils/ProblemUtility");
const Problem = require("../models/problem");


const createProblem = async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution
    } = req.body;

    try {
        if (!Array.isArray(referenceSolution) || referenceSolution.length === 0) {
            return res.status(400).send("referenceSolution must be a non-empty array");
        }

        if (!Array.isArray(visibleTestCases) || visibleTestCases.length === 0) {
            return res.status(400).send("visibleTestCases must be a non-empty array");
        }

        for (const { language, completeCode } of referenceSolution) {

            // ✅ FIXED
            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

                const submitResult = await submitBatch(submissions);

                  console.log("SUBMIT RESULT:", submitResult);

               if (!Array.isArray(submitResult)) {
                  throw new Error("Judge0 submission failed: no submissions returned");
               }

                const resultToken = submitResult
                 .map((value) => value.token)
                 .filter(Boolean);

                if (resultToken.length === 0) {
                  throw new Error("Judge0 submission failed: no tokens received");
                }
        }

        await Problem.create({
            ...req.body,
            problemCreator: req.user?.id
        });

        res.status(201).send("Problem Saved Successfully");

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const status = message.startsWith("Judge0") ? 502 : 400;
        res.status(status).send("Error: " + message);
    }
};

module.exports = createProblem;
