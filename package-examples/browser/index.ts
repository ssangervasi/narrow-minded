import { narrow, Guard } from "narrow-minded";

const handleClick = () => {
  console.log("Click");

  const inputEl: HTMLTextAreaElement = document.querySelector("#input")!;
  const outputEl: HTMLPreElement = document.querySelector("#output")!;

  const parsed = parse(inputEl.value);

  if (!narrow(["object"], parsed)) {
    outputEl.innerText = "Invalid JSON";
    return;
  }

  const results = parsed.map(check);

  outputEl.innerText = results.join("\n--\n");
};

const AnimalGuard = new Guard(
  (
    u
  ): u is {
    type: "animal";
    legs: number;
    name: string;
  } => narrow({ type: "string" }, u) && u.type == "animal"
);

const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const check = (parsed: unknown): string => {
  if (AnimalGuard.satisfied(parsed)) {
    return [
      "AnimalGuard satisfied",
      `name: ${parsed.name}`,
      `legs: ${parsed.legs}`,
    ].join("\n");
  }

  if (narrow({ content: "string", sentAt: "number" }, parsed)) {
    const sentAt: number = parsed.sentAt;
    const sentDate = new Date(sentAt);

    return [
      "Narrowed",
      `content: ${parsed.content}`,
      `sentAt to Date: ${sentDate}`,
    ].join("\n");
  }

  if (narrow({ type: "string" }, parsed)) {
    return `Narrowed type to a string: ${parsed.type}`;
  }

  return "Did not narrow.";
};

Object.assign(window, {
  handleClick,
});
