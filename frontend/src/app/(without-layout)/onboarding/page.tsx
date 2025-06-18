import React from "react";
import Welcome from "./welcome";

const OnboardingPage = () => {
  return (
    <div className="bg-wh w-full h-screen">
      <div className="w-full h-screen bg-bl/80 flex justify-center items-center">
        <Welcome />
      </div>
    </div>
  );
};

export default OnboardingPage;
