import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from "qrcode.react";
import { ZKPassport } from "@zkpassport/sdk";
import MyGlobe from './Globe';

async function verifyOnChain(proofResult, walletProvider, isIDCard) {

  const zkPassport = new ZKPassport("your-domain.com");

  // Get verification parameters
  const verifierParams = zkPassport.getSolidityVerifierParameters({
    proof: proofResult,
    // Use the same scope as the one you specified with the request function
    scope: "my-scope",
    // Enable dev mode if you want to use mock passports, otherwise keep it false
    devMode: false,
  });

  // Create wallet client
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(walletProvider),
  });

  // Get the account
  const [account] = await walletClient.getAddresses();

  // Create a public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  // Call your contract with the verification parameters
  const hash = await walletClient.writeContract({
    address: YOUR_CONTRACT_ADDRESS,
    abi: YOUR_CONTRACT_ABI,
    functionName: "register",
    args: [verifierParams, isIDCard],
    account,
  });

  // Wait for the transaction
  await publicClient.waitForTransactionReceipt({ hash });

  console.log("Verification completed on-chain!");
}

export default function App() {

    const [url, setUrl] = useState<string | null>(null);

    const zkPassport = useMemo(() => new ZKPassport("https://mitrydoug.github.io/iknewthat/"), []);

    useEffect(() => {

        const constructRequest = async () => {
            // Create a request with your app details
            const queryBuilder = await zkPassport.request({
                name: "I Am Here",
                // A description of the purpose of the request
                purpose: "Roll call",
                logo: "https://mitrydoug.github.io/iknewthat/iKnewThatFav.svg",
                // Optional scope for the user's unique identifier
                scope: "iamhere",
                // To verify proofs on EVM chains, you need to set the mode to "compressed-evm"
                mode: "compressed-evm",
                devMode: true,
            });

            // Build your query with the required attributes or conditions you want to verify
            const {
                url,
                requestId,
                onRequestReceived,
                onGeneratingProof,
                onProofGenerated,
                onResult,
                onReject,
                onError,
            } = queryBuilder
            // Verify the user's age is greater than or equal to 18
            .gte("age", 18)
            // Bind to the chain where the proof will be verified
            .bind("chain", "ethereum_sepolia")
            // Finalize the query
            .done();

            let proof: ProofResult;
            // Use the proofResult from the onProofGenerated callback to get the proof
            onProofGenerated((proofResult) => {
                proof = proofResult;
            });

            onResult(async ({
                uniqueIdentifier,
                verified,
                result,
            }) => {
                if (!verified) {
                // If the proof is not verified, save yourself some gas and return straight away
                console.log("Proof is not verified");
                return;
                }

                // Get the verification parameters
                const verifierParams = zkPassport.getSolidityVerifierParameters({
                proof: proof,
                // Use the same scope as the one you specified with the request function
                scope: "my-scope",
                // Enable dev mode if you want to use mock passports, otherwise keep it false
                devMode: false,
                });

                // Get the wallet provider
                const walletProvider = await getWalletProvider();

                // Verify the proof on-chain
                // The function is defined in the next steps below
                await verifyOnChain(
                    verifierParams,
                    walletProvider,
                    // Use the document type to determine if the proof is for an ID card or passport
                    result.document_type.disclose.result !== "passport"
                );
            });

            onRequestReceived(() => {
                console.log("Request received");
            });

            onGeneratingProof(() => {
                console.log("Generating proof...");
            });

            onReject(() => {
                console.log("Rejected");
            });

            onError((error) => {
                console.error("Error:", error);
            });

            setUrl(url);

        };

        constructRequest();
    }, []);

    if (!url) {
        return <div><h3>Loading...</h3></div>;
    } else {
        /*return (
            <div id="root">
                <h3>Verify that you are over 18!</h3>
                <QRCodeSVG value={url} size={256} level="L"/>
            </div>
        );*/
        return (
            <div id="root">
                <MyGlobe />
                <div style={{ position: "absolute", zIndex: 2, top: "40px", left: "40px"}}>
                    <h3>Get on the list!</h3>
                    <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "8px" }}>
                        <QRCodeSVG value={url} size={256} level="L"/>
                    </div>
                    
                </div>
            </div>
        );
    }
}
