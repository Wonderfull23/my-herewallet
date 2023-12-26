import { HereProviderRequest, HereProviderResult, HereProviderStatus } from "@here-wallet/core";
import { NearSnap, NearSnapAccount, TransactionSignRejected } from "@near-snap/sdk";
import { QRCode } from "@here-wallet/core/build/qrcode-strategy";

export enum ConnectType {
  Ledger = "ledger",
  Here = "here",
  Snap = "snap",
}

const snap = new NearSnap();

const sendResponse = async (id: string, data: HereProviderResult) => {
  const res = await fetch(`https://h4n.app/${id}/response`, {
    body: JSON.stringify({ data: JSON.stringify(data) }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!res.ok) throw Error();
};

export const connectMetamask = async (id: string, request: HereProviderRequest) => {
  try {
    await snap.install();
    await sendResponse(id, { status: HereProviderStatus.APPROVING });

    if (request.type === "sign" && "recipient" in request) {
      const result = await snap.signMessage({
        message: request.message,
        network: (request.network as any) || "mainnet",
        recipient: request.recipient,
        nonce: request.nonce,
      });

      if (result == null) {
        await sendResponse(id, { status: HereProviderStatus.FAILED });
        return;
      }

      await sendResponse(id, {
        status: HereProviderStatus.SUCCESS,
        account_id: result.accountId,
        payload: JSON.stringify({
          signature: result.signature,
          accountId: result.accountId,
          publicKey: result.publicKey,
          type: ConnectType.Snap,
        }),
      });
    }

    if (request.type === "call") {
      await sendResponse(id, { status: HereProviderStatus.APPROVING }).catch(() => {});

      const network = (request.network as any) || "mainnet";
      const account = await NearSnapAccount.restore({ snap, network }).catch(async () => {
        return await NearSnapAccount.connect({ snap, network });
      });

      if (account == null) return await sendResponse(id, { status: HereProviderStatus.FAILED });

      const trxs = request.transactions.map((t) => ({
        receiverId: t.receiverId || account.accountId,
        signerId: account.accountId,
        actions: t.actions,
      }));

      const result = await account.executeTransactions(trxs as any);
      await sendResponse(id, {
        status: HereProviderStatus.SUCCESS,
        account_id: account.accountId,
        payload: JSON.stringify({
          transactions: result.map((t) => t.transaction_outcome.id),
          publicKey: account.publicKey,
          type: ConnectType.Snap,
        }),
      });
    }
  } catch (e) {
    if (e instanceof TransactionSignRejected) throw e;
    await sendResponse(id, { status: HereProviderStatus.FAILED });
  }
};

export const connectHere = async (id: string, el?: HTMLElement) => {
  if (window.localStorage.getItem("topic")) {
    fetch("https://api.herewallet.app/api/v1/transactions/topic/sign", {
      method: "POST",
      body: JSON.stringify({
        topic: window.localStorage.getItem("topic"),
        request_id: id,
      }),
    });
  }

  const link = `herewallet://request/${id}`;
  const qrcode = new QRCode({ ...darkQR, value: link });
  qrcode.canvas.classList.add("here-connector-card");
  qrcode.render();

  setTimeout(() => el?.appendChild(qrcode.canvas), 700);
};

export const darkQR = {
  value: "",
  radius: 0.8,
  ecLevel: "H",
  fill: {
    type: "linear-gradient",
    position: [0, 0, 1, 1],
    colorStops: [
      [0, "#2C3034"],
      [0.34, "#4F5256"],
      [1, "#2C3034"],
    ],
  },
  size: 256,
  withLogo: true,
  imageEcCover: 0.7,
  quiet: 1,
} as const;

export const mobileCheck = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent);
  return check;
};
