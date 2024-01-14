import styled, { css } from "styled-components";
import { ActivityIndicator } from "../uikit/ActivityIndicator";
import { H2, Text } from "../uikit/typographic";

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 0 16px;
  padding-bottom: 56px;
  position: relative;
  width: 100%;
  box-sizing: border-box;

  > img:first-child {
    width: 146px;
    height: 209px;
    position: absolute;
    left: 56px;
    bottom: 0;
  }

  > img:last-child {
    width: 138px;
    height: 198px;
    position: absolute;
    right: 56px;
    bottom: 0;
  }

  @media (max-width: 800px) {
    > img:first-child {
      display: none;
    }

    > img:last-child {
      display: none;
    }
  }
`;

export const Flexbox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

export const Appstore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  p {
    font-weight: 500;
    font-size: 16px;
    line-height: 22px;
    text-align: center;
    color: #6b6661;

    margin: 0;
    margin-top: 16px;
  }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 800px) {
    width: 100%;
  }
`;

export const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
  min-height: calc(var(--vh, 1vh) * 100);
  width: 100%;
`;

export const Container = styled.div`
  height: 100vh;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const Wrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 16px;
  padding-right: 20px;
`;

export const Card = styled.div<{ isLoading?: boolean }>`
  position: relative;
  background: #ebdedc;
  border: 1px solid #2c3034;
  box-shadow: 8px 8px 0px #2c3034;
  border-radius: 16px;

  width: 794px;
  margin: 0 0 28px 0;
  padding: 40px 50px;
  min-height: 428px;
  margin-top: 48px;
  gap: 48px;

  display: flex;
  justify-content: space-between;

  ${(p) =>
    p.isLoading &&
    css`
      &::after {
        content: "";
        top: 0;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(235, 222, 220, 0.8);
        border-radius: 15px;
      }
    `}

  ${ActivityIndicator} {
    position: absolute;
    z-index: 10;
    top: 50%;
    left: 50%;
    margin: -40px;
  }

  @media (max-width: 800px) {
    width: calc(100vw - 32px);
    padding: 16px 0;
    margin-top: 16px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    min-height: fit-content;
  }
`;

export const ScanCode = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;

  ${H2} {
    margin-bottom: 16px;
    text-align: center;
  }

  ${Text} {
    width: 250px;
    text-align: center;
  }

  @media (max-width: 800px) {
    width: 100%;
    padding: 0 16px;

    svg {
      width: 150px;
      height: 150px;
    }

    ${H2} {
      margin-top: 8px;
      margin-bottom: 0;
    }

    ${Text} {
      width: 100%;
    }
  }
`;
