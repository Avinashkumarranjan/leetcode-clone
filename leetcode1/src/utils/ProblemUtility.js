const axios = require("axios");

const getRapidApiKey = () => {
    const key = process.env.RAPID_API_KEY;
    if (!key || typeof key !== "string" || key.trim().length === 0) {
        throw new Error("RAPID_API_KEY is missing in environment");
    }
    return key.trim();
};

const getRapidApiHost = () => {
    const host = process.env.RAPID_API_HOST;
    if (!host) return "judge0-ce.p.rapidapi.com";
    if (typeof host !== "string" || host.trim().length === 0) {
        throw new Error("RAPID_API_HOST is invalid");
    }
    return host.trim();
};

const getLanguageById = (lang) => {
    const language = {
        "c++": 54,
        "java": 62,
        "javascript": 63
    };

    if (!lang) {
        throw new Error("Language is missing");
    }

    const key = lang.trim().toLowerCase();

    if (!language[key]) {
        throw new Error(`Unsupported language: ${lang}`);
    }

    return language[key];
};

const submitBatch = async (submissions) => {

    if (!Array.isArray(submissions) || submissions.length === 0) {
        throw new Error("submissions must be a non-empty array");
    }

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: { base64_encoded: 'false' },
        headers: {
            'X-RapidAPI-Key': getRapidApiKey(),
            'X-RapidAPI-Host': getRapidApiHost(),
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        },
        timeout: 30000
    };

    try {
        const response = await axios.request(options);
        console.log("FULL RESPONSE:", response.data);

        if (!Array.isArray(response?.data?.submissions)) {
            throw new Error("Unexpected Judge0 batch response shape");
        }

        return response.data.submissions; // ✅ FIX
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data;
            const detail =
                (typeof data === "string" && data) ||
                data?.message ||
                data?.error ||
                JSON.stringify(data || {});
            const hint =
                status === 403 && typeof detail === "string" && detail.toLowerCase().includes("not subscribed")
                    ? " (RapidAPI plan/subscription missing for this API, or RAPID_API_HOST is wrong)"
                    : "";
            throw new Error(`Judge0 submitBatch failed${status ? ` (${status})` : ""}: ${detail}${hint}`);
        }

        throw error;
    }
};

const waiting = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const submitToken = async (resultToken) => {

    if (!resultToken || resultToken.length === 0) {
        throw new Error("Token is not present");
    }

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'X-RapidAPI-Key': getRapidApiKey(),
            'X-RapidAPI-Host': getRapidApiHost(),
            'Content-Type': 'application/json'
        },
        timeout: 30000
    };

    const fetchData = async () => {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const data = error.response?.data;
                const detail =
                    (typeof data === "string" && data) ||
                    data?.message ||
                    data?.error ||
                    JSON.stringify(data || {});
                const hint =
                    status === 403 && typeof detail === "string" && detail.toLowerCase().includes("not subscribed")
                        ? " (RapidAPI plan/subscription missing for this API, or RAPID_API_HOST is wrong)"
                        : "";
                throw new Error(`Judge0 submitToken failed${status ? ` (${status})` : ""}: ${detail}${hint}`);
            }

            throw error;
        }
    };

  while (true) {
    const result = await fetchData();

    if (!result?.submissions) {
        console.log("Waiting for valid response...");
        await waiting(1000);
        continue;
    }

    const isResultObtained = result.submissions.every(
        (r) => r.status_id > 2
    );

    if (isResultObtained)
        return result.submissions;

    await waiting(1000);
  }
};

module.exports = { getLanguageById, submitBatch, submitToken };
