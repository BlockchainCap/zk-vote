import { useState, useEffect } from "react";
import { ERC721 } from "../generated";

export const useReadNFTData = (nftContract: ERC721) => {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const getSymbol = async () => {
      const symbol = await nftContract.symbol();
      setSymbol(symbol);
    };
    const getName = async () => {
      const name = await nftContract.name();
      setName(name);
    };

    getSymbol();
    getName();
  }, [nftContract]);

  return { name, symbol };
};
