const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper.js');
/**
 * MultiSig
 * @class MultiSig
 */
class MultiSig {
    /**
     * Creates an instance of MultiSig.
     * @param {Object} MultiSig class
     */
    constructor(Wallet, bnSigner) {
        this.Wallet = Wallet;
        this.bnSigner = bnSigner;
        this.publicKeys = [];
    }

    /**
     * 
     * @param {Array<hex>} publicKeys 
     * @returns publicKey
     */
    async addPublicKeys(publicKeys) {
        try {
            if (!publicKeys || publicKeys.length == 0) {
                throw "Need public keys"
            }
            this.publicKeys = this.publicKeys.concat(publicKeys)
            let pub = await BNSignerWrapper.AggregatePublicKeys(publicKeys)
            this.publicKey = pub;
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.addPublicKeys: " + String(ex));
        }
    }

    /**
     * Get the multsig public key
     * @returns Public Key
     */
    async getPubK() {
        try {
            if (!this.publicKeys || this.publicKeys.length == 0) {
                throw "Need public keys"
            }
            let pub = await BNSignerWrapper.AggregatePublicKeys(this.publicKeys)
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.getPubK" + String(ex));
        }
    }

    /**
     * get the multisig address
     * @returns address
     */
    async getAddress() {
        try {
            if (!this.publicKeys || this.publicKeys.length == 0) {
                throw "Need public keys"
            }
            let pubKey = await this.getPubK();
            let pub = await this.bnSigner.getAddress(pubKey)
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.getAddress" + String(ex));
        }
    }

    /**
     * Sign a message
     * @param {hex} rawMsg
     * @return {hex} signature
     */
    async sign(rawMsg, groupPubKey = false) {
        try {
            if (!rawMsg) {
                throw "Missing input";
            }
            if (!groupPubKey) {
                groupPubKey = await this.getPubK()
            }
            let sig = await BNSignerWrapper.AggregateSign(rawMsg, groupPubKey, this.bnSigner.privK);
            await this.verifyAggregateSingle(rawMsg, groupPubKey, sig);
            return sig;
        }
        catch (ex) {
            throw new Error("BNAggregate.sign: " + String(ex));
        }
    }

    /**
 * Sign a message
 * @param {hex} rawMsg
 * @return {hex} signature
 */
    async signMulti(rawMsgs, groupPubKey = false) {
        try {
            let signedMsgs = [];
            for (let i = 0; i < rawMsgs.length; i++) {
                let sig = await this.sign(rawMsgs[i], groupPubKey)
                signedMsgs.push(sig)
            }
            return signedMsgs;
        }
        catch (ex) {
            throw new Error("BNAggregate.aggregateMulti: " + String(ex));
        }
    }

    /**
     * Aggregate signatures from multiple parties
     * @param {Array<hex>} signature
     * @returns 
     */
    async aggregateSignatures(signatures) {
        try {
            let sig = await BNSignerWrapper.AggregateSignatures(signatures)
            return sig;
        }
        catch (ex) {
            throw new Error("BNAggregate.signatures: " + String(ex));
        }
    }

    /**
     * Aggregate multiple signatures
     * @param {Array<Array<hex>>} signatures 
     * @returns 
     */
    async aggregateSignaturesMulti(signatures) {
        try {
            let signed = [];
            for (let i = 0; i < signatures.length; i++) {
                let sig = await this.aggregateSignatures(signatures[i])
                signed.push(sig)
            }
            return signed;
        }
        catch (ex) {
            throw new Error("BNAggregate.signaturesMulti: " + String(ex));
        }
    }

    /**
     * Verify aggregate signature
     * @param {hex} msg 
     * @param {hex} sig 
     * @returns 
     */
    async verifyAggregate(msg, sig) {
        try {
            sig = this.Wallet.Utils.isHex(sig);
            let aSig = await this.bnSigner.verify(msg, sig)
            return aSig;
        }
        catch (ex) {
            throw new Error("BNAggregate.verifyAggregateSingle: " + String(ex));
        }
    }

    /**
     * Verify an solo signed aggregated message 
     * @param {hex} msg 
     * @param {hex} sig 
     * @returns 
     */
    async verifyAggregateSingle(msg, groupPubKey, sig) {
        try {
            sig = this.Wallet.Utils.isHex(sig);
            let aSig = await BNSignerWrapper.AggregateVerifySingle(msg, groupPubKey, sig)
            return aSig;
        }
        catch (ex) {
            throw new Error("BNAggregate.verifyAggregateSingle: " + String(ex));
        }
    }
}
module.exports = MultiSig;