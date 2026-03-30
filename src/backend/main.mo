import List "mo:core/List";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";

actor {
  type Contact = {
    name : Text;
    email : Text;
    message : Text;
    submitTime : Time.Time;
  };

  module Contact {
    public func compare(c1 : Contact, c2 : Contact) : Order.Order {
      Int.compare(c2.submitTime, c1.submitTime);
    };
  };

  let contacts = List.empty<Contact>();

  public shared ({ caller }) func submitContactForm(name : Text, email : Text, message : Text) : async Bool {
    let contact : Contact = {
      name;
      email;
      message;
      submitTime = Time.now();
    };
    contacts.add(contact);
    true;
  };

  public query ({ caller }) func getAllContactForms() : async [Contact] {
    contacts.toArray().sort();
  };
};
