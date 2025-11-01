/**
 * Mock email fixtures for testing
 * These are fake dispatch emails used in unit tests
 */

import type { FetchMessageObject } from "imapflow";
import type { Email } from "@/backend/domain/email";

/**
 * Mock dispatch email with GPS coordinates
 */
export const mockDispatchEmailWithGPS: Email = {
  uid: 1,
  subject: "DISPATCH: Structure Fire at Main St",
  from: "dispatch@firedept.com",
  to: "station1@firedept.com",
  receivedDate: new Date("2025-01-11T10:30:00Z"),
  flags: ["\\Seen"],
  text: "Emergency dispatch: Structure fire reported at 123 Main Street. GPS: 49.947014 N, 17.885027 E",
  html: "<p>Emergency dispatch: Structure fire reported at 123 Main Street.</p><p>GPS: 49.947014 N, 17.885027 E</p>",
};

/**
 * Mock dispatch email without GPS
 */
export const mockDispatchEmailNoGPS: Email = {
  uid: 2,
  subject: "DISPATCH: Medical Emergency",
  from: "dispatch@firedept.com",
  to: "station1@firedept.com",
  receivedDate: new Date("2025-01-11T11:00:00Z"),
  flags: [],
  text: "Medical emergency at City Hall. No specific location provided.",
  html: "<p>Medical emergency at City Hall. No specific location provided.</p>",
};

/**
 * Mock dispatch email with multiple GPS coordinates
 */
export const mockDispatchEmailMultipleGPS: Email = {
  uid: 3,
  subject: "DISPATCH: Multi-Vehicle Accident",
  from: "dispatch@firedept.com",
  to: "station1@firedept.com",
  receivedDate: new Date("2025-01-11T11:30:00Z"),
  flags: [],
  text: "Multi-vehicle accident. First location: 50.123456 N, 18.654321 E. Second location: 50.234567 N, 18.765432 E",
  html: "<p>Multi-vehicle accident.</p><p>First location: 50.123456 N, 18.654321 E</p><p>Second location: 50.234567 N, 18.765432 E</p>",
};

/**
 * Mock ImapFlow FetchMessageObject
 */
export const mockImapFlowMessage = (email: Email): FetchMessageObject => {
  return {
    uid: email.uid,
    flags: new Set(email.flags),
    envelope: {
      date: email.receivedDate,
      subject: email.subject,
      from: [{ name: "", address: email.from }],
      to: [{ name: "", address: email.to }],
      sender: [{ name: "", address: email.from }],
      replyTo: [],
      cc: [],
      bcc: [],
      inReplyTo: "",
      messageId: `<${email.uid}@test.com>`,
    },
    bodyStructure: {
      type: "text",
      childNodes: [],
      disposition: null,
      dispositionParameters: null,
      encoding: "quoted-printable",
      id: undefined,
      language: null,
      lines: 10,
      location: null,
      md5: null,
      parameters: { charset: "UTF-8" },
      size: 1000,
    },
    internalDate: email.receivedDate,
    size: 1000,
    seq: email.uid,
    source: Buffer.from(email.text || ""),
  } as unknown as FetchMessageObject;
};

/**
 * List of all mock emails
 */
export const allMockEmails = [
  mockDispatchEmailWithGPS,
  mockDispatchEmailNoGPS,
  mockDispatchEmailMultipleGPS,
];
