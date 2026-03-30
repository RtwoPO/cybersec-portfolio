import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Contact {
    name: string;
    submitTime: Time;
    email: string;
    message: string;
}
export type Time = bigint;
export interface backendInterface {
    getAllContactForms(): Promise<Array<Contact>>;
    submitContactForm(name: string, email: string, message: string): Promise<boolean>;
}
