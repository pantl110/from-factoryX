import React from "react";
import ProductCommentItem from "./product-comment-item";

const ProductComment = () => {
  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 py-1 px-3 text-sv">등록일</p>
        <p className="flex-1 py-1 px-3 text-sv">작성자</p>
        <p className="flex-4 py-1 px-3 text-sv">내용</p>
      </div>

      {[...Array(2)].map((_, index) => (
        <ProductCommentItem key={index} />
      ))}
    </div>
  );
};

export default ProductComment;
