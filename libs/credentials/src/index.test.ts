import { BigNumber } from "ethers"
import blockchainBalance from "./validators/blockchainBalance"
import blockchainTransactions from "./validators/blockchainTransactions"
import githubPersonalStars from "./validators/githubPersonalStars"
import addProvider from "./addProvider"
import addProviders from "./addProviders"
import addValidator from "./addValidator"
import addValidators from "./addValidators"
import getProvider from "./getProvider"
import getValidator from "./getValidator"
import providers from "./providers"
import validators from "./validators"
import {
    validateCredentials,
    validateManyCredentials
} from "./validateCredentials"
import { testUtils } from "."
import { evaluate, tokenize } from "./evaluateExpression"

describe("Credentials library", () => {
    describe("# addProvider", () => {
        it("Should add a provider to the list of supported providers", () => {
            addProvider({} as any)

            expect(providers).toHaveLength(5)
        })
    })

    describe("# addProviders", () => {
        it("Should add 2 providers to the list of supported providers", () => {
            addProviders([{} as any, {} as any])

            expect(providers).toHaveLength(7)
        })
    })

    describe("# addValidator", () => {
        it("Should add a validator to the list of supported validators", () => {
            addValidator({} as any)

            expect(validators).toHaveLength(9)
        })
    })

    describe("# addValidators", () => {
        it("Should add 2 validators to the list of supported validators", () => {
            addValidators([{} as any, {} as any])

            expect(validators).toHaveLength(11)
        })
    })

    describe("# getProvider", () => {
        it("Should return an existing provider", () => {
            const provider = getProvider("github")

            expect(provider).toBeDefined()
        })

        it("Should not return an existing provider if it does not exist", () => {
            const fun = () => getProvider("reddit")

            expect(fun).toThrow(`Provider 'reddit' does not exist`)
        })
    })

    describe("# getValidators", () => {
        it("Should return an existing validator", () => {
            const validator = getValidator("GITHUB_FOLLOWERS")

            expect(validator).toBeDefined()
        })

        it("Should not return an existing validator if it does not exist", () => {
            const fun = () => getValidator("EEE")

            expect(fun).toThrow(`Validator 'EEE' does not exist`)
        })
    })

    describe("# validateCredentials", () => {
        const jsonRpcProviderMocked = {
            getBalance: jest.fn(),
            getTransactionCount: jest.fn()
        }
        it("Should return true if an account has a balance greater than or equal to 10", async () => {
            jsonRpcProviderMocked.getBalance.mockReturnValue(
                BigNumber.from("12000000000000000000")
            )

            const result = await validateCredentials(
                {
                    id: blockchainBalance.id,
                    criteria: {
                        minBalance: "10",
                        network: "sepolia"
                    }
                },
                {
                    address: "0x",
                    jsonRpcProvider: jsonRpcProviderMocked
                }
            )

            expect(result).toBeTruthy()
        })
        it("Should return true if an account has a balance greater than or equal to 10 and greater than or equal to 10 transactions", async () => {
            jsonRpcProviderMocked.getBalance.mockReturnValue(
                BigNumber.from("12000000000000000000")
            )
            jsonRpcProviderMocked.getTransactionCount.mockReturnValue(12)

            const credentials = [
                {
                    id: blockchainBalance.id,
                    criteria: {
                        minBalance: "10",
                        network: "sepolia"
                    }
                },
                {
                    id: blockchainTransactions.id,
                    criteria: {
                        minTransactions: 10,
                        network: "sepolia"
                    }
                }
            ]

            const contexts = [
                {
                    address: "0x",
                    jsonRpcProvider: jsonRpcProviderMocked
                },
                {
                    address: "0x",
                    jsonRpcProvider: jsonRpcProviderMocked
                }
            ]
            const expression = ["", "and", ""]
            const result = await validateManyCredentials(
                credentials,
                contexts,
                expression
            )

            expect(result).toBeTruthy()
        })
        it("Should validate many credentials with parentheses in the expression", async () => {
            // This will meet the criteria
            jsonRpcProviderMocked.getBalance.mockReturnValue(
                BigNumber.from("12000000000000000000")
            )
            // This will not meet the criteria
            jsonRpcProviderMocked.getTransactionCount.mockReturnValue(8)
            // This will meet the criteria
            testUtils.mockAPIOnce(
                Array.from(Array(20).keys()).map(() => ({
                    stargazers_count: 10
                }))
            )

            const credentials = [
                {
                    id: blockchainBalance.id,
                    criteria: {
                        minBalance: "10",
                        network: "sepolia"
                    }
                },
                {
                    id: blockchainTransactions.id,
                    criteria: {
                        minTransactions: 10,
                        network: "sepolia"
                    }
                },
                {
                    id: githubPersonalStars.id,
                    criteria: {
                        minStars: 100
                    }
                }
            ]

            const contexts = [
                {
                    address: "0x",
                    jsonRpcProvider: jsonRpcProviderMocked
                },
                {
                    address: "0x",
                    jsonRpcProvider: jsonRpcProviderMocked
                },
                {
                    profile: {},
                    accessTokens: { github: "token" }
                }
            ]
            const expression = ["", "and", "(", "", "or", "", ")"]
            const result = await validateManyCredentials(
                credentials,
                contexts,
                expression
            )

            expect(result).toBeTruthy()
        })
    })
    describe("# evaluateExpression", () => {
        describe("# tokenize", () => {
            it("Should sucessfully tokenize a logical expression", () => {
                const expression = "true and false or ( true and true )"

                const tokens = tokenize(expression)

                const result = [
                    "true",
                    "and",
                    "false",
                    "or",
                    "(",
                    "true",
                    "and",
                    "true",
                    ")"
                ]

                expect(tokens).toStrictEqual(result)
            })
        })
        describe("# evaluate", () => {
            it("Should sucessfully evaluate a logical expression with the and operator", () => {
                const expression = ["true", "and", "false"]
                const result = evaluate(expression)
                expect(result).toBeFalsy()
            })
            it("Should sucessfully evaluate a logical expression with the or operator", () => {
                const expression = ["true", "or", "false"]
                const result = evaluate(expression)
                expect(result).toBeTruthy()
            })
            it("Should sucessfully evaluate a logical expression with the not operator", () => {
                const expression = ["not", "false"]
                const result = evaluate(expression)
                expect(result).toBeTruthy()
            })
            it("Should sucessfully evaluate a logical expression with the xor operator", () => {
                const expression = ["false", "xor", "true"]
                const result = evaluate(expression)
                expect(result).toBeTruthy()
            })
            it("Should sucessfully evaluate a logical expression with the and or not and xor operators", () => {
                const expression = [
                    "true",
                    "and",
                    "false",
                    "or",
                    "not",
                    "false",
                    "xor",
                    "true"
                ]
                const result = evaluate(expression)
                expect(result).toBeFalsy()
            })
            it("Should sucessfully evaluate a logical expression with parentheses", () => {
                const expression = [
                    "true",
                    "and",
                    "false",
                    "or",
                    "(",
                    "true",
                    "and",
                    "true",
                    ")"
                ]
                const result = evaluate(expression)
                expect(result).toBeTruthy()
            })
        })
    })
})
