interface ProfileImageProps {
  text: string;
  size?: "small" | "large";
}
const ProfileImage = ({ text, size = "large" }: ProfileImageProps) => {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary-8 border border-primary text-primary ${
        size === "small" ? "w-8 h-8 text-[12px]" : "w-18 h-18 Me_Body-3"
      }`}
    >
      {text}
    </div>
  );
};

export default ProfileImage;
