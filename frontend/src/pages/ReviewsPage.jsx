import { useState } from "react";
import { Star, Package, Edit } from "lucide-react";
import ReviewList from "../components/ReviewList";
import ReviewableProducts from "../components/ReviewableProducts";

const ReviewsPage = () => {
	const [activeTab, setActiveTab] = useState("my-reviews");

	const tabs = [
		{ id: "my-reviews", label: "My Reviews", icon: Star },
		{ id: "reviewable", label: "Write Reviews", icon: Edit }
	];

	return (
		<div className="min-h-screen bg-gray-900 py-8">
			<div className="max-w-6xl mx-auto px-4">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">
						My Reviews
					</h1>
					<p className="text-gray-400">
						Manage your product reviews and write new ones
					</p>
				</div>

				{/* Tabs */}
				<div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg w-fit">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
									activeTab === tab.id
										? "bg-emerald-600 text-white"
										: "text-gray-400 hover:text-white hover:bg-gray-700"
								}`}
							>
								<Icon size={18} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				{/* Tab Content */}
				<div className="bg-gray-800 rounded-lg p-6">
					{activeTab === "my-reviews" && (
						<div>
							<div className="mb-6">
								<h2 className="text-xl font-semibold text-white mb-2">
									Your Reviews
								</h2>
								<p className="text-gray-400">
									All the reviews you've written for products you've purchased
								</p>
							</div>
							<ReviewList userReviews={true} />
						</div>
					)}

					{activeTab === "reviewable" && (
						<ReviewableProducts />
					)}
				</div>
			</div>
		</div>
	);
};

export default ReviewsPage;
