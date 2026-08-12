import { Cloudinary } from '@cloudinary/url-gen'
import {BACKEND_BASE_URL, CLOUDINARY_CLOUD_NAME} from "@/constants";
import {fill} from "@cloudinary/url-gen/actions/resize";
import {dpr, format, quality} from "@cloudinary/url-gen/actions/delivery";
import {source} from "@cloudinary/url-gen/actions/overlay";
import {text} from "@cloudinary/url-gen/qualifiers/source";
import { TextStyle } from '@cloudinary/url-gen/qualifiers/textStyle'
import {Position} from "@cloudinary/url-gen/qualifiers/position";
import {compass} from "@cloudinary/url-gen/qualifiers/gravity";

const cld = new Cloudinary({ cloud: { cloudName: CLOUDINARY_CLOUD_NAME }});

// Passed as the Cloudinary upload widget's `uploadSignature` option. The widget
// calls this with whatever params it's about to send (folder, timestamp, source,
// ...) and expects the signature for exactly those params back — the actual
// signing (which needs the Cloudinary API secret) happens server-side.
export const signUploadParams = (
    callback: (signature: string) => void,
    paramsToSign: Record<string, string | number>
) => {
    fetch(`${BACKEND_BASE_URL}/uploads/sign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
    })
        .then((res) => res.json())
        .then((data: { signature: string }) => callback(data.signature))
        .catch((e) => console.error("Cloudinary signing failed:", e));
};

export const bannerPhoto = (imageCldPubId: string, name: string) => {
    return cld
        .image(imageCldPubId)
        .resize(fill())
        .delivery(format('auto'))
        .delivery(quality('auto'))
        .delivery(dpr('auto'))
        .overlay(
            source(
                text(name, new TextStyle("roboto", 100).fontWeight("bold")).textColor(
                    "white"
                )
            ).position(
                new Position()
                    .gravity(compass("west"))
                    .offsetX(0.02)
            )
        );
}
