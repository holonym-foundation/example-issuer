import React, { useState } from "react";

interface FormProps {
  // Props go here
}

const IssuerForm: React.FC<FormProps> = (props) => {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");

  async function handleSubmit() {
    // Step 1. User submits data
    const resp = await fetch("/api/issuer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        middleName,
        lastName,
        birthdate,
      }),
    });
    const data = await resp.json();

    // Step 3. Issuer redirects user to Holonym frontend
    const holonymUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3002"
        : "https://app.holonym.id";
    const thisUrl = window.location.href;
    const retrievalEndpoint = `${thisUrl}api/issuer?userId=${data.userId}`;
    window.location.href = `${holonymUrl}/mint/credentials?retrievalEndpoint=${retrievalEndpoint}`;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        First name
        <input
          type="text"
          value={firstName}
          required={true}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setFirstName(event.target.value)
          }
        />
      </label>
      <br />
      <label>
        Middle name
        <input
          type="text"
          value={middleName}
          required={true}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setMiddleName(event.target.value)
          }
        />
      </label>
      <br />
      <label>
        Last name
        <input
          type="text"
          value={lastName}
          required={true}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setLastName(event.target.value)
          }
        />
      </label>
      <br />
      <label>
        Birthdate
        <input
          type="date"
          value={birthdate}
          required={true}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setBirthdate(event.target.value)
          }
        />
      </label>
      <br />
      <input type="submit" value="Submit" />
    </form>
  );
};

export default IssuerForm;
