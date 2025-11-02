#include <iostream>
#include <typeinfo>

class Base {
    virtual void foo() {}
};

class Derived : public Base {
    //
};

int main(){
    Base* b = new Derived;
    std::cout << "type: " << typeid(*b).name() << std::endl;

    delete b;
    return 0;
}