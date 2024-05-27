const { exec } = require("child_process");
const fs = require("fs");

const privateKeyPath = "private.key";
const csrPath = "certificate.csr";
const certificatePath = "certificate.crt";

function generatePrivateKey() {
  return new Promise((resolve, reject) => {
    exec(
      `openssl genrsa -out ${privateKeyPath} 2048`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error generating private key: ${error.message}`);
          return reject(error);
        }
        console.log("Private key generated");
        resolve();
      }
    );
  });
}

function generateCSR() {
  return new Promise((resolve, reject) => {
    exec(
      `openssl req -new -key ${privateKeyPath} -out ${csrPath} -subj "/CN=localhost"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error generating CSR: ${error.message}`);
          return reject(error);
        }
        console.log("CSR generated");
        resolve();
      }
    );
  });
}

function generateCertificate() {
  return new Promise((resolve, reject) => {
    exec(
      `openssl x509 -req -days 365 -in ${csrPath} -signkey ${privateKeyPath} -out ${certificatePath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error generating certificate: ${error.message}`);
          return reject(error);
        }
        console.log("Certificate generated");
        resolve();
      }
    );
  });
}

async function generateCertificates() {
  try {
    await generatePrivateKey();
    await generateCSR();
    await generateCertificate();
    console.log("SSL certificates generated successfully");
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}

generateCertificates();
