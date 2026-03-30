import { useMutation } from "@tanstack/react-query";

export function useSubmitContact() {
  return useMutation({
    mutationFn: async ({
      name,
      email,
      message,
    }: {
      name: string;
      email: string;
      message: string;
    }) => {
      // On GitHub Pages there is no backend — open a mailto link instead
      const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );
      window.open(`mailto:anup@cybersec.pro?subject=${subject}&body=${body}`);
      return true;
    },
  });
}
