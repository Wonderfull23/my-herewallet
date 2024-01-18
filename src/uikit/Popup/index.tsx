import { action, makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";

interface PopupConfig {
  id: string;
  element: React.ReactNode;
  onClose?: () => void;
}

class SheetsManager {
  public popups: (PopupConfig & { isOpen: boolean })[] = [];

  constructor() {
    makeObservable(this, { popups: observable, present: action });
  }

  present = ({ id, element, onClose }: PopupConfig) => {
    this.popups.push({
      id,
      element,
      isOpen: true,
      onClose: action(() => {
        const popup = this.popups.find((t) => t.id === id);
        if (!popup) return;

        popup.isOpen = false;
        setTimeout(() => {
          this.popups = this.popups.filter((t) => t.id !== id);
          onClose?.();
        }, 300);
      }),
    });
  };

  dismiss = (id: string) => {
    this.popups.find((t) => t.id === id)?.onClose?.();
  };
}

const Popup = ({ children, onClose, isOpen }: { children: React.ReactNode; isOpen: boolean; onClose?: () => void }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (!bodyRef.current || !overlayRef.current) return;
        bodyRef.current.style.transform = `translateY(0)`;
        overlayRef.current.style.backdropFilter = "blur(10px)";
        overlayRef.current.style.backgroundColor = "#00000044";
      }, 50);
      return () => clearTimeout(timer);
    }

    if (!bodyRef.current || !overlayRef.current) return;
    bodyRef.current.style.transform = `translateY(100%)`;
    overlayRef.current.style.backdropFilter = "blur(0)";
    overlayRef.current.style.backgroundColor = "#00000000";
  }, [isOpen]);

  return (
    <PopupWrap>
      <PopupOverlay ref={overlayRef} onClick={() => onClose?.()} />
      <PopupBody ref={bodyRef}>{children}</PopupBody>
    </PopupWrap>
  );
};

export const sheets = new SheetsManager();

const PopupsProvider = observer(() => {
  return (
    <div>
      {sheets.popups.map(({ id, element, isOpen, onClose }) => (
        <Popup key={id} onClose={onClose} isOpen={isOpen}>
          {element}
        </Popup>
      ))}
    </div>
  );
});

const PopupWrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 100000;
`;

const PopupBody = styled.div`
  border-radius: 24px 24px 0px 0px;
  width: 100%;
  border-radius: 20px 20px 0px 0px;
  background: var(--Elevation-0, #f3ebea);
  position: relative;
  transform: translateY(100%);
  transition: 0.2s transform;
`;

const PopupOverlay = styled.div`
  transition: 0.2s backdrop-filter, 0.2s background-color;
  backdrop-filter: blur(0px);
  background-color: #00000000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export default PopupsProvider;