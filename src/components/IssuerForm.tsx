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
    console.log(data);
    alert(data?.data);
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
