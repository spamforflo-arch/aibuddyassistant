const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        className="floating-orb w-96 h-96 bg-primary top-[-10%] left-[-10%]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="floating-orb w-72 h-72 bg-accent bottom-[10%] right-[-5%]"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="floating-orb w-48 h-48 bg-wave-3 top-[40%] left-[60%]"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
};

export default BackgroundOrbs;
