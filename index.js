// Code to handle signature and tell user wtf is going on with the signature
const getKey = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const generate = async (prompt) => {
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';

  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
      n: 1,
    }),
  });

  const completion = await completionResponse.json();

  return completion.choices[0].text;
};

const generateExplanation = async (signature) => {
  try {
    const basePromptPrefix = `
    I am going to provide you with signature request information from MetaMask. Usually, this is not user-friendly, so you need to explain to the user what they are really going to sign with their wallet. 
    use tables if necessary,not use too much text,any mom must understand,avoid showing hexadecimal or technical things,be specific,use emojis if they add value,tell what will happen after sign,instead of chain ID show in text which chain it is,alert if the request looks fraudulent and explain why,if I am going to receive or send tokens or NFTs, tell me which tokens and how much,numbers are important,DONT explain transaction definitions,never include nonce or version

    This is the signature request from Metamask:
    `;

    const basePromtSuffix = `User friendly explanation:
    `;

    const baseCompletion = await generate(
      `${basePromptPrefix}${signature}${basePromtSuffix}`
    );

    console.log(baseCompletion);
  } catch (error) {
    console.log(error);
  }
};

// Code to handle OPEN AI API Key
const checkForKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      resolve(result['openai-key']);
    });
  });
};

const encode = (input) => {
  return btoa(input);
};

const saveKey = () => {
  const input = document.getElementById('key_input');

  if (input) {
    const { value } = input;

    // Encode String
    const encodedValue = encode(value);

    // Save to google storage
    chrome.storage.local.set({ 'openai-key': encodedValue }, () => {
      document.getElementById('key_needed').style.display = 'none';
      document.getElementById('key_entered').style.display = 'block';
    });
  }
};

const changeKey = () => {
  document.getElementById('key_needed').style.display = 'block';
  document.getElementById('key_entered').style.display = 'none';
};

document.getElementById('save_key_button').addEventListener('click', saveKey);
document
  .getElementById('change_key_button')
  .addEventListener('click', changeKey);

checkForKey().then((response) => {
  if (response) {
    document.getElementById('key_needed').style.display = 'none';
    document.getElementById('key_entered').style.display = 'block';
  }
});

// Get the signature data from the URL
const queryString = window.location.search;
if (queryString) {
  const encodedData = queryString.substring(1).split('=')[1];
  if (encodedData) {
    const signatureData = JSON.parse(decodeURIComponent(encodedData));
    if (signatureData) {
      generateExplanation(signatureData);
    }
  }
}
