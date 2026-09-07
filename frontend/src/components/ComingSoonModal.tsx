"use client";

export default function ComingSoonModal({
  feature,
  onClose,
}: {
  feature: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#e1e1e5] bg-white p-6 shadow-xl">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-[#f0ecff] text-[#6741d2]">
          ✦
        </div>

        <h2 className="mt-4 text-base font-semibold">{feature}</h2>

        <p className="mt-2 text-sm leading-6 text-[#6f7078]">
          This feature is a placeholder for this assignment and is coming soon.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            className="rounded-md bg-[#6941d8] px-4 py-2 text-sm font-medium text-white hover:bg-[#5c36c6]"
            onClick={onClose}
            type="button"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}