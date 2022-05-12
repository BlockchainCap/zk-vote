import { BigNumber } from "ethers";
import { useState, useEffect } from "react";
import { ERC721 } from "../generated";

export const useReadBalance = (
  address: string | undefined,
  contract: ERC721 | undefined
) => {
  const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0));
  useEffect(() => {
    const getBalance = async (address: string | undefined) => {
      if (!address || !contract) return setBalance(BigNumber.from(0));
      const result = await contract.balanceOf(address);
      return setBalance(result);
    };
    const listenForUpdates = (address: string | undefined) => {
      const listener = (): void => {
        void getBalance(address);
      };
      try {
        contract?.provider.on("block", listener);
      } catch (err) {
        console.log(err);
      }
    };

    getBalance(address);
    listenForUpdates(address);
  }, [address, contract]);
  return balance;
};
