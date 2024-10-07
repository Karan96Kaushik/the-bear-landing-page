import React from 'react';

const features = [
  { title: "Explore Trails", description: "Discover new hiking trails and outdoor adventures." },
  { title: "Track Wildlife", description: "Monitor local wildlife movements in real-time." },
  { title: "Adventure Planner", description: "Plan your next trip with expert recommendations." },
];

const Features = () => {
  return (
    <section className="py-20 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">What The Bear Offers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 hover:scale-105 transform"
            >
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
