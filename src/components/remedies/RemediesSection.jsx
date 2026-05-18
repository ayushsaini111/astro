import React from "react";

import RemedyCard from "./RemedyCard";

import { remedies } from "@/data/remedies";

function RemediesSection() {
  return (
    <section
      className="
        px-s16
        lg:px-0

        flex
        flex-col
        gap-s24
      "
    >

      {remedies.map((item) => (
        <RemedyCard
          key={item.id}

          id={item.id}

          title={item.title}
          description={item.description}
          image={item.image}

          overlay={item.overlay}

          titleColor={item.titleColor}
          descriptionColor={
            item.descriptionColor
          }
        />
      ))}

    </section>
  );
}

export default RemediesSection;