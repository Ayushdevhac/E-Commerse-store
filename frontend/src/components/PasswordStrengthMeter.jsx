import { Check, X } from "lucide-react";

const PasswordStrengthMeter = ({ password, minLength = 8 }) => {
    const criteria = [
        { label: `At least ${minLength} characters`, test: (pass) => pass.length >= minLength },
        { label: "Contains uppercase letter", test: (pass) => /[A-Z]/.test(pass) },
        { label: "Contains lowercase letter", test: (pass) => /[a-z]/.test(pass) },
        { label: "Contains a number", test: (pass) => /\d/.test(pass) },
        { label: "Contains special character", test: (pass) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
    ];

    const passedCriteria = criteria.filter((criterion) => criterion.test(password));
    const strength = passedCriteria.length;

    const getStrengthColor = (strength) => {
        if (strength === 0) return "bg-gray-200 dark:bg-gray-700";
        if (strength <= 2) return "bg-red-500";
        if (strength <= 3) return "bg-yellow-500";
        if (strength <= 4) return "bg-blue-500";
        return "bg-green-500";
    };

    const getStrengthText = (strength) => {
        if (strength === 0) return "Enter a password";
        if (strength <= 2) return "Weak";
        if (strength <= 3) return "Fair";
        if (strength <= 4) return "Good";
        return "Strong";
    };

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-300">Password strength</span>
                <span className={`text-sm font-medium ${
                    strength <= 2 ? 'text-red-400' : 
                    strength <= 3 ? 'text-yellow-400' :
                    strength <= 4 ? 'text-blue-400' : 'text-green-400'
                }`}>
                    {getStrengthText(strength)}
                </span>
            </div>
            
            {/* Strength Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                ></div>
            </div>

            {/* Criteria List */}
            <div className="space-y-1">
                {criteria.map((criterion, index) => {
                    const isMet = criterion.test(password);
                    return (
                        <div key={index} className="flex items-center text-sm">
                            <div className={`mr-2 rounded-full p-1 ${
                                isMet ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                                {isMet ? (
                                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                ) : (
                                    <X className="h-3 w-3 text-gray-400" />
                                )}
                            </div>
                            <span className={`${
                                isMet ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {criterion.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
