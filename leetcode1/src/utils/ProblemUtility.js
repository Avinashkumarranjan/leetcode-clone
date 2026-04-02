const axios = require('axios');

const isJudge0DebugEnabled = () => {
  return String(process.env.DEBUG_JUDGE0 || '').trim().toLowerCase() === 'true';
};

const hasDirectJudge0 = () => {
  return typeof process.env.JUDGE0_URL === 'string' && process.env.JUDGE0_URL.trim().length > 0;
};

const isBatchDisabled = () => {
  return String(process.env.JUDGE0_DISABLE_BATCH || '').trim().toLowerCase() === 'true';
};

const getBaseUrl = () => {
  const url = hasDirectJudge0() ? process.env.JUDGE0_URL : 'https://judge0-ce.p.rapidapi.com';
  return String(url).trim().replace(/\/+$/, '');
};

const getRapidApiKey = () => {
  const key = process.env.RAPID_API_KEY;
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('RAPID_API_KEY is missing in environment (or set JUDGE0_URL=http://localhost:2358 to use Docker)');
  }
  return key.trim();
};

const getRapidApiHost = () => {
  const host = process.env.RAPID_API_HOST;
  if (!host) return 'judge0-ce.p.rapidapi.com';
  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error('RAPID_API_HOST is invalid');
  }
  return host.trim();
};

const getHeaders = () => {
  if (hasDirectJudge0()) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'X-RapidAPI-Key': getRapidApiKey(),
    'X-RapidAPI-Host': getRapidApiHost(),
    'Content-Type': 'application/json'
  };
};

const stringifyPreview = (value, maxLen = 500) => {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}...` : s;
  } catch {
    return String(value);
  }
};

const getLanguageById = (lang) => {

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }

    if(!lang)
      throw new Error("Language is Missing");

    const id = language[String(lang).trim().toLowerCase()];

    if(!id)
      throw new Error(`Unsupported Language: ${lang}`);

    return id;
}


const submitBatch = async (submissions)=>{

  if(!Array.isArray(submissions) || submissions.length==0)
    throw new Error("submissions must be a non-empty array");

  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const submitSingle = async (submission) => {
    const options = {
      method: 'POST',
      url: `${baseUrl}/submissions`,
      params: { base64_encoded: false },
      headers,
      data: submission,
      timeout: 30000
    };

    try {
      const response = await axios.request(options);
      const token = response && response.data ? response.data.token : null;
      if (!token) {
        throw new Error(`Judge0 submitSingle invalid response: ${stringifyPreview(response?.data)}`);
      }
      return { token };
    } catch (error) {
      if (error && error.code=="ECONNREFUSED" && process.env.JUDGE0_URL) {
        throw new Error(
          `Judge0 is not running on ${process.env.JUDGE0_URL}. Start Docker Desktop, then run: docker compose -f docker-compose.judge0.yml up -d`
        );
      }
      if (error && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        throw new Error(`Judge0 submitSingle failed (${status}): ${stringifyPreview(data)}`);
      }
      throw error;
    }
  };

  if (isBatchDisabled()) {
    if (isJudge0DebugEnabled()) console.log("JUDGE0: batch disabled, falling back to single submissions");
    return Promise.all(submissions.map(submitSingle));
  }

  const options = {
    method: 'POST',
    url: `${baseUrl}/submissions/batch`,
    params: { base64_encoded: false },
    headers,
    data: { submissions },
    timeout: 30000
  };

  const parseBatchResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.submissions)) return data.submissions;
    if (Array.isArray(data?.tokens)) return data.tokens.map((token) => ({ token }));
    return null;
  };

  try{
    const response = await axios.request(options);
    if (isJudge0DebugEnabled()) console.log("JUDGE0 submitBatch response:", response.data);

    const result = parseBatchResponse(response?.data);
    if(Array.isArray(result)) return result;

    if (isJudge0DebugEnabled()) {
      console.log("JUDGE0 submitBatch unexpected shape, falling back to single. Data:", stringifyPreview(response?.data));
    }
    return Promise.all(submissions.map(submitSingle));
  }
  catch(error){
    if(error && error.code=="ECONNREFUSED" && process.env.JUDGE0_URL){
      throw new Error(
        `Judge0 is not running on ${process.env.JUDGE0_URL}. Start Docker Desktop, then run: docker compose -f docker-compose.judge0.yml up -d`
      );
    }
    if(error && error.response){
      const status = error.response.status;
      const data = error.response.data;
      const detail = stringifyPreview(data);
      if (status === 404 || status === 405) {
        if (isJudge0DebugEnabled()) console.log("JUDGE0 submitBatch not supported, falling back to single. Status:", status);
        return Promise.all(submissions.map(submitSingle));
      }
      throw new Error(`Judge0 submitBatch failed (${status}): ${detail}`);
    }
    throw error;
  }
}


const waiting = (timer)=>{
  return new Promise((resolve)=> setTimeout(resolve,timer));
}

// ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

const submitToken = async (resultToken) => {

  if(!Array.isArray(resultToken) || resultToken.length==0)
    throw new Error("Token is not present");

  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const options = {
    method: 'GET',
    url: `${baseUrl}/submissions/batch`,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: false,
      fields: '*'
    },
    headers,
    timeout: 30000
  };

  const intervalMs = Number.parseInt(process.env.JUDGE0_POLL_INTERVAL_MS || '1000', 10);
  const maxMs = Number.parseInt(process.env.JUDGE0_POLL_MAX_MS || '60000', 10);
  const start = Date.now();

  const fetchSingle = async (token) => {
    const singleOptions = {
      method: 'GET',
      url: `${baseUrl}/submissions/${encodeURIComponent(token)}`,
      params: { base64_encoded: false, fields: '*' },
      headers,
      timeout: 30000
    };

    const response = await axios.request(singleOptions);
    const data = response?.data || null;
    if (data && !data.token) return { ...data, token };
    return data;
  };

  const fetchMany = async () => {
    const response = await axios.request(options);
    const data = response?.data;
    if (Array.isArray(data?.submissions)) return data.submissions;
    return null;
  };

  while(true){
    try{
      let submissions = null;

      if (!isBatchDisabled()) {
        submissions = await fetchMany();
      }

      if (!Array.isArray(submissions)) {
        submissions = await Promise.all(resultToken.map(fetchSingle));
      }

      if(!Array.isArray(submissions)){
        await waiting(intervalMs);
        continue;
      }

      const IsResultObtained = submissions.every((r)=>r && r.status_id>2);

      if(IsResultObtained)
        return submissions;
    }
    catch(error){
      if(error && error.code=="ECONNREFUSED" && process.env.JUDGE0_URL){
        throw new Error(
          `Judge0 is not running on ${process.env.JUDGE0_URL}. Start Docker Desktop, then run: docker compose -f docker-compose.judge0.yml up -d`
        );
      }
      if(error && error.response){
        const status = error.response.status;
        const data = error.response.data;
        const detail = stringifyPreview(data);
        throw new Error(`Judge0 submitToken failed (${status}): ${detail}`);
      }
      throw error;
    }

    if (Date.now() - start > maxMs) {
      throw new Error(`Judge0 submitToken timed out after ${maxMs}ms`);
    }

    await waiting(intervalMs);
  }
}


module.exports = {getLanguageById,submitBatch,submitToken};








// 
